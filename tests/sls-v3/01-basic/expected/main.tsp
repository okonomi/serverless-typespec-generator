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
op createUser(
  @doc("""
    User object to create.
    
    This is a multi-line description.
    """)
  @body
  body: User,
): void;

model User {
  @doc("""
    User's name.
    """)
  name: string;

  @doc("""
    User's email address.
    """)
  @format("email")
  email: string;

  @doc("""
    User's birthday.
    """)
  @pattern("^\\d{4}-\\d{2}-\\d{2}$")
  birthday: string;
}
