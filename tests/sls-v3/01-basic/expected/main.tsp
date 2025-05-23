import "@typespec/http";

using Http;

@service(#{ title: "Generated API" })
namespace GeneratedApi;

@summary("Create user")
@doc("""
  Create a user with the given name and email.
  
  This is a multi-line description.
  """)
@route("/users")
@post
op createUser(@body body: User): void;

model User {
  name: string;
  email: string;
}
