import SwiftUI

struct User: Identifiable {
    let id = UUID()
    let name: String
    let userName: String
}

let users: [User] = [
    User(name: "Alex Becker", userName: "alex"),
    User(name: "Sam Weber", userName: "sam"),
    User(name: "Taylor Klein", userName: "taylor")
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
                            Text(user.userName)
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
