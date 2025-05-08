import "@typespec/http";

using Http;

@service(#{ title: "Generated API" })
namespace GeneratedApi;

@route("/users/{id}")
@get
op getUser(@path id: string): {
  @statusCode statusCode: 200;
  @body body: User;
};

model User {
  id: string;
  name: string;
  email: string;
}
