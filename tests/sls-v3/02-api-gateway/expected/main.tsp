import "@typespec/http";

using Http;

@service(#{ title: "Generated API" })
namespace GeneratedApi;

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
