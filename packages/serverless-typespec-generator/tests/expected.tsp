import "@typespec/http";

using Http;

@service(#{ title: "Generated API" })
namespace GeneratedApi;

@route("/users")
@post
op createUser(@body body: User): CreateUserResponse;

model User {
  username: string;
  email: string;
  password: string;
}

model CreateUserResponse {
  userId: string;
  username: string;
  email: string;
}
