import "@typespec/http";

using Http;

@service(#{ title: "Generated API" })
namespace GeneratedApi;

@route("/users/{id}")
@get
op getUser(
  @doc("""
    The ID of the user to retrieve
    """)
  @path
  id: string,
): {
  @statusCode statusCode: 200;
  @body body: User;
};

@route("/posts/{id}")
@get
op getPost(
  @path
  id: string,
): {
  @statusCode statusCode: 200;
  @body body: Post;
};

model User {
  id: string;
  name: string;
  email: string;
}

model Post {
  id: string;
  title: string;
  content: string;
}
