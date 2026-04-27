import Foundation
import SwiftUI
import WebKit

private let webAppURL = URL(string: "https://4zsk66f0-3000.euw.devtunnels.ms/")!
private let mobileBackendURL = URL(string: "https://app-voice-live-mobile-backend-4mlyqpwfzauts.azurewebsites.net")!

struct BackendSession: Decodable {
    let sessionId: String
    let displayName: String
}

struct TokenResponse: Decodable {
    struct Configuration: Decodable {
        let endpoint: String
        let agentName: String
        let projectName: String
    }

    let accessToken: String
    let config: Configuration
}

struct VoiceLiveWebConfiguration {
    let sessionId: String
    let endpoint: String
    let agentName: String
    let projectName: String
    let accessToken: String
}

struct WebAppView: View {
    let user: User
    @State private var webConfiguration: VoiceLiveWebConfiguration?
    @State private var errorMessage: String?

    var body: some View {
        Group {
            if let webConfiguration {
                WebView(webConfiguration: webConfiguration)
                    .ignoresSafeArea(edges: .bottom)
            } else if let errorMessage {
                Text(errorMessage)
                    .foregroundStyle(.red)
                    .padding()
            } else {
                ProgressView("Preparing demo session...")
            }
        }
        .navigationTitle(user.name)
        .navigationBarTitleDisplayMode(.inline)
        .task(id: user.userName) {
            do {
                errorMessage = nil
                webConfiguration = try await createVoiceLiveWebConfiguration(for: user.userName)
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}

struct WebView: UIViewRepresentable {
    let webConfiguration: VoiceLiveWebConfiguration

    func makeCoordinator() -> Coordinator {
        Coordinator(webConfiguration: webConfiguration)
    }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.uiDelegate = context.coordinator
        webView.navigationDelegate = context.coordinator
        webView.isOpaque = false
        webView.scrollView.bounces = false

        webView.load(URLRequest(url: webAppURL))

        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    class Coordinator: NSObject, WKUIDelegate, WKNavigationDelegate {
        let webConfiguration: VoiceLiveWebConfiguration

        init(webConfiguration: VoiceLiveWebConfiguration) {
            self.webConfiguration = webConfiguration
        }

        // Auto-grant microphone permission
        func webView(
            _ webView: WKWebView,
            requestMediaCapturePermissionFor origin: WKSecurityOrigin,
            initiatedByFrame frame: WKFrameInfo,
            type: WKMediaCaptureType,
            decisionHandler: @escaping (WKPermissionDecision) -> Void
        ) {
            decisionHandler(.grant)
        }

        // Connect the embedded web app once the page finishes loading.
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            let js = buildConnectScript(webConfiguration: webConfiguration)
            webView.evaluateJavaScript(js)
        }
    }
}

func createVoiceLiveWebConfiguration(for userName: String) async throws -> VoiceLiveWebConfiguration {
    let session = try await postJSON(
        path: "/login",
        body: ["userName": userName],
        responseType: BackendSession.self
    )
    let tokenResponse = try await postJSON(
        path: "/vlapi/token",
        body: ["sessionId": session.sessionId],
        responseType: TokenResponse.self
    )

    return VoiceLiveWebConfiguration(
        sessionId: session.sessionId,
        endpoint: tokenResponse.config.endpoint,
        agentName: tokenResponse.config.agentName,
        projectName: tokenResponse.config.projectName,
        accessToken: tokenResponse.accessToken
    )
}

func postJSON<T: Decodable>(path: String, body: [String: String], responseType: T.Type) async throws -> T {
    let normalizedPath = path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
    var request = URLRequest(url: mobileBackendURL.appendingPathComponent(normalizedPath))
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue("application/json", forHTTPHeaderField: "Accept")
    request.httpBody = try JSONSerialization.data(withJSONObject: body)

    let (data, response) = try await URLSession.shared.data(for: request)
    guard let httpResponse = response as? HTTPURLResponse, 200..<300 ~= httpResponse.statusCode else {
        let message = String(data: data, encoding: .utf8) ?? "Unknown backend error"
        throw NSError(domain: "MobileBackend", code: 1, userInfo: [NSLocalizedDescriptionKey: message])
    }

    return try JSONDecoder().decode(T.self, from: data)
}

func buildConnectScript(webConfiguration: VoiceLiveWebConfiguration) -> String {
    let config: [String: Any] = [
        "connectionTransport": "direct",
        "authType": "entraToken",
        "entraToken": webConfiguration.accessToken,
        "endpoint": webConfiguration.endpoint,
        "mode": "agent",
        "agentName": webConfiguration.agentName,
        "agentProjectName": webConfiguration.projectName,
        "hostSessionId": webConfiguration.sessionId,
        "isAvatar": false
    ]

    let data = try! JSONSerialization.data(withJSONObject: config)
    let json = String(data: data, encoding: .utf8)!

    return """
    (function connectVoiceLiveAvatarFromHost() {
            const config = \(json);
      if (window.connectVoiceLiveAvatar) {
        window.connectVoiceLiveAvatar(config).catch(console.error);
      } else {
        setTimeout(connectVoiceLiveAvatarFromHost, 250);
      }
    })();
    """
}
