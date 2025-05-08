import "@typespec/http";

using Http;

@service(#{ title: "Generated API" })
namespace GeneratedApi;

@route("/users/{id}")
@get
op getUser(@path id: string): User;

model User {
  id: string;
  name: string;
  email: string;
}
