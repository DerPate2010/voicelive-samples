import SwiftUI
import WebKit

struct WebAppView: View {
    let user: User

    var body: some View {
        WebView(sessionID: user.sessionID)
            .ignoresSafeArea(edges: .bottom)
            .navigationTitle(user.name)
            .navigationBarTitleDisplayMode(.inline)
    }
}

struct WebView: UIViewRepresentable {
    let sessionID: String

    func makeCoordinator() -> Coordinator {
        Coordinator(sessionID: sessionID)
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

        let url = URL(string: "https://test-vl-app.azurewebsites.net/")!
        webView.load(URLRequest(url: url))

        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    class Coordinator: NSObject, WKUIDelegate, WKNavigationDelegate {
        let sessionID: String

        init(sessionID: String) {
            self.sessionID = sessionID
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

        // Call setSessionContext() once the page finishes loading
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            let js = "if (typeof setSessionContext === 'function') { setSessionContext('\(sessionID)'); }"
            webView.evaluateJavaScript(js)
        }
    }
}
