import SwiftUI

struct User: Identifiable {
    let id = UUID()
    let name: String
    let sessionID: String
}

let users: [User] = [
    User(name: "Tom Miller", sessionID: "tom_miller_static_session"),
    User(name: "Sarah Johnson", sessionID: "sarah_johnson_static_session"),
    User(name: "Max Weber", sessionID: "max_weber_static_session")
]

struct ContentView: View {
    var body: some View {
        NavigationStack {
            List(users) { user in
                NavigationLink(destination: WebAppView(user: user)) {
                    HStack(spacing: 12) {
                        Image(systemName: "person.circle.fill")
                            .font(.largeTitle)
                            .foregroundStyle(.tint)
                        VStack(alignment: .leading) {
                            Text(user.name)
                                .font(.headline)
                            Text(user.sessionID)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding(.vertical, 4)
                }
            }
            .navigationTitle(String(localized: "users_title"))
        }
    }
}

#Preview {
    ContentView()
}
