import "@typespec/http";

using Http;

@service(#{ title: "Generated API" })
namespace GeneratedApi;

@route("/posts/{id}")
@get
op getPost(@path id: string): {
  @statusCode statusCode: 200;
  @body body: {
    id: string;
    title: string;
    content: string;
    author: {
      id: string;
      name: string;
      email: string;
    };
  };
};
