import { getApiKey } from "./config";

const BASE_URL = "https://denizlg24.com";

export interface IBlog {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  timeToRead: number;
  media?: string[];
  tags?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBlogPayload {
  title: string;
  excerpt: string;
  media: string[];
  content: string;
  tags: string[];
  isActive: boolean;
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function getAuthHeaders(): Record<string, string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new ApiError(401, "No API key configured.");
  return {
    authorization: `Bearer ${apiKey}`,
    "content-type": "application/json",
  };
}

export async function fetchBlogs(): Promise<IBlog[]> {
  const res = await fetch(`${BASE_URL}/api/admin/blogs`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new ApiError(res.status, `Failed to fetch blogs: ${res.status}`);
  }
  const data = (await res.json()) as { blogs: IBlog[] };
  return data.blogs;
}

export async function fetchBlogSummaries(): Promise<
  Pick<IBlog, "title" | "excerpt" | "tags">[]
> {
  const blogs = await fetchBlogs();
  return blogs.map(({ title, excerpt, tags }) => ({ title, excerpt, tags }));
}

export async function createBlog(payload: CreateBlogPayload): Promise<IBlog> {
  const res = await fetch(`${BASE_URL}/api/admin/blogs`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new ApiError(res.status, `Failed to create blog: ${res.status}`);
  }
  const data = (await res.json()) as { blog: IBlog };
  return data.blog;
}
