import "@typespec/http";
import "@typespec/versioning";

using Http;
using Versioning;

@service(#{ title: "Generated API" })
@doc("""
  
  """)
@versioned(Versions)
namespace GeneratedApi;

enum Versions {
  v1: "1.0.0",
}

@route("/users")
@post
op createUser(
  @body
  body: User,
): {
  @statusCode statusCode: 201;
  @body body: CreatedUser;
} | {
  @statusCode statusCode: 400;
  @body body: {
    code: string;
    message: string;
  };
};

model User {
  name: string;
  email: string;
}

model CreatedUser {
  id: string;
  name: string;
  email: string;
}
