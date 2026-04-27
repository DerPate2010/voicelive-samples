package com.example.voiceliveblueprint

import android.Manifest
import android.annotation.SuppressLint
import android.os.Bundle
import android.view.ViewGroup
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ListItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.example.voiceliveblueprint.ui.theme.VoiceLiveBlueprintTheme
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

private const val WebAppUrl = "https://4zsk66f0-3000.euw.devtunnels.ms/"
private const val MobileBackendUrl = "https://app-voice-live-mobile-backend-4mlyqpwfzauts.azurewebsites.net"

data class User(val name: String, val userName: String)
data class BackendSession(val sessionId: String, val displayName: String)
data class VoiceLiveWebConfig(
    val sessionId: String,
    val endpoint: String,
    val agentName: String,
    val projectName: String,
    val accessToken: String
)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            VoiceLiveBlueprintTheme {
                MainNavigation()
            }
        }
    }
}

@Composable
fun MainNavigation() {
    val navController = rememberNavController()
    val users = listOf(
        User(stringResource(R.string.user_1_name), "alex"),
        User(stringResource(R.string.user_2_name), "sam"),
        User(stringResource(R.string.user_3_name), "taylor")
    )

    NavHost(navController = navController, startDestination = "userList") {
        composable("userList") {
            UserListScreen(users) { user ->
                navController.navigate("webView/${user.userName}")
            }
        }
        composable(
            "webView/{userName}",
            arguments = listOf(navArgument("userName") { type = NavType.StringType })
        ) { backStackEntry ->
            val userName = backStackEntry.arguments?.getString("userName") ?: ""
            WebViewScreen(userName) {
                navController.popBackStack()
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UserListScreen(users: List<User>, onUserSelected: (User) -> Unit) {
    Scaffold(
        topBar = {
            TopAppBar(title = { Text(stringResource(R.string.user_list_title)) })
        }
    ) { innerPadding ->
        LazyColumn(modifier = Modifier.padding(innerPadding)) {
            items(users) { user ->
                ListItem(
                    headlineContent = { Text(user.name) },
                    supportingContent = { Text(user.userName) },
                    modifier = Modifier.clickable { onUserSelected(user) }
                )
                HorizontalDivider()
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WebViewScreen(userName: String, onBack: () -> Unit) {
    var hasPermission by remember { mutableStateOf(false) }
    var webConfig by remember { mutableStateOf<VoiceLiveWebConfig?>(null) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    val coroutineScope = rememberCoroutineScope()
    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        hasPermission = isGranted
    }

    LaunchedEffect(Unit) {
        permissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
    }

    LaunchedEffect(userName) {
        errorMessage = null
        webConfig = null
        coroutineScope.launch {
            try {
                webConfig = createVoiceLiveWebConfig(userName)
            } catch (error: Exception) {
                errorMessage = error.message ?: error.toString()
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.app_name)) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = stringResource(R.string.back_button)
                        )
                    }
                }
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            if (hasPermission) {
                when {
                    webConfig != null -> WebViewComponent(webConfig!!)
                    errorMessage != null -> Text(
                        text = errorMessage!!,
                        modifier = Modifier.padding(16.dp),
                        color = MaterialTheme.colorScheme.error
                    )
                    else -> Text(
                        text = stringResource(R.string.loading_demo_session),
                        modifier = Modifier.padding(16.dp)
                    )
                }
            } else {
                Text(
                    text = stringResource(R.string.microphone_permission_needed),
                    modifier = Modifier.padding(16.dp),
                    color = MaterialTheme.colorScheme.error
                )
            }
        }
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun WebViewComponent(webConfig: VoiceLiveWebConfig) {
    AndroidView(
        factory = { context ->
            WebView(context).apply {
                layoutParams = ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                settings.mediaPlaybackRequiresUserGesture = false
                
                // Wichtig für responsive Web-Apps und korrekte Höhenberechnung
                settings.loadWithOverviewMode = true
                settings.useWideViewPort = true

                webViewClient = object : WebViewClient() {
                    override fun onPageFinished(view: WebView?, url: String?) {
                        super.onPageFinished(view, url)
                        view?.evaluateJavascript(buildConnectScript(webConfig), null)
                    }
                }

                webChromeClient = object : WebChromeClient() {
                    override fun onPermissionRequest(request: PermissionRequest?) {
                        request?.grant(request.resources)
                    }
                }

                WebView.setWebContentsDebuggingEnabled(true)

                loadUrl(WebAppUrl)
            }
        },
        modifier = Modifier.fillMaxSize()
    )
}

suspend fun createVoiceLiveWebConfig(userName: String): VoiceLiveWebConfig = withContext(Dispatchers.IO) {
    val session = loginDemoUser(userName)
    val tokenResponse = postJson(
        "$MobileBackendUrl/vlapi/token",
        JSONObject().put("sessionId", session.sessionId)
    )
    val config = tokenResponse.getJSONObject("config")

    VoiceLiveWebConfig(
        sessionId = session.sessionId,
        endpoint = config.optString("endpoint"),
        agentName = config.optString("agentName"),
        projectName = config.optString("projectName"),
        accessToken = tokenResponse.getString("accessToken")
    )
}

private fun loginDemoUser(userName: String): BackendSession {
    val response = postJson(
        "$MobileBackendUrl/login",
        JSONObject().put("userName", userName)
    )

    return BackendSession(
        sessionId = response.getString("sessionId"),
        displayName = response.optString("displayName")
    )
}

private fun postJson(url: String, body: JSONObject): JSONObject {
    val connection = (URL(url).openConnection() as HttpURLConnection).apply {
        requestMethod = "POST"
        setRequestProperty("Content-Type", "application/json")
        setRequestProperty("Accept", "application/json")
        doOutput = true
    }

    connection.outputStream.use { output ->
        output.write(body.toString().toByteArray(Charsets.UTF_8))
    }

    val responseText = if (connection.responseCode in 200..299) {
        connection.inputStream.bufferedReader().use { it.readText() }
    } else {
        val errorText = connection.errorStream?.bufferedReader()?.use { it.readText() }.orEmpty()
        throw IllegalStateException("Backend request failed (${connection.responseCode}): $errorText")
    }

    return JSONObject(responseText)
}

private fun buildConnectScript(webConfig: VoiceLiveWebConfig): String {
    val config = JSONObject()
        .put("connectionTransport", "direct")
        .put("authType", "entraToken")
        .put("entraToken", webConfig.accessToken)
        .put("endpoint", webConfig.endpoint)
        .put("mode", "agent")
        .put("agentName", webConfig.agentName)
        .put("agentProjectName", webConfig.projectName)
        .put("hostSessionId", webConfig.sessionId)
        .put("isAvatar", false)

    return """
        (function connectVoiceLiveAvatarFromHost() {
          const config = $config;
          if (window.connectVoiceLiveAvatar) {
            window.connectVoiceLiveAvatar(config).catch(console.error);
          } else {
            setTimeout(connectVoiceLiveAvatarFromHost, 250);
          }
        })();
    """.trimIndent()
}
