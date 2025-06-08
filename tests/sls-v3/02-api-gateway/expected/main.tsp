import "@typespec/http";
import "@typespec/versioning";

using Http;
using Versioning;

@service(#{ title: "Generated API" })
@versioned(Versions)
namespace GeneratedApi;

enum Versions {
  ver: "1.0.0",
}

@route("/users")
@post
op createUser(
  @body
  body: User,
): void;

model User {
  name: string;
  email: string;
}
