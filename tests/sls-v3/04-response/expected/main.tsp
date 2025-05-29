import "@typespec/http";

using Http;

@service(#{ title: "Generated API" })
namespace GeneratedApi;

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
