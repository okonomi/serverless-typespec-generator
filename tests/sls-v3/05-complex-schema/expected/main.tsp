import "@typespec/http";
import "@typespec/versioning";

using Http;
using Versioning;

@service(#{ title: "Generated API" })
@versioned(Versions)
namespace GeneratedApi;

enum Versions {
  ver: "1.0.0",
}

@route("/posts/{id}")
@get
op getPost(
  @path
  id: string,
): {
  @statusCode statusCode: 200;
  @body body: {
    id: string;
    title: string;
    content: string;
    status: "draft" | "in_review" | "published" | "archived";
    author: {
      id: string;
      name: string;
      email: string;
      status?: "active" | "inactive" | "banned" | null;
    };
    tags: string | string[];
  };
};

@route("/posts")
@get
op getPosts(): {
  @statusCode statusCode: 200;
  @body body: {
    id: string;
    title: string;
    content: string;
    status: "draft" | "in_review" | "published" | "archived";
    author: {
      id: string;
      name: string;
      email: string;
      status?: "active" | "inactive" | "banned" | null;
    };
    tags: string | string[];
  }[];
};

alias Tags = {
  @doc("""
    Tag slug
    """)
  slug: string;

  @doc("""
    Tag name
    """)
  name: string;
}[];
