// import { formatDate } from "@fulltemplate/common";
// import Image from "next/image";
import type { Route } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

// import Footer from "~/components/Footer";
// import Header from "~/components/Header";
import { Container } from "~/components/mdx/Container";
import { Prose } from "~/components/mdx/Prose";

// import { BLOGS } from "~/data/blogs";
// import { type Article } from "~/lib/articles";
// import BlogShare from "./BlogShare";

export function ArticleLayout({
  // article,
  children,
}: {
  // article: Article;
  children: React.ReactNode;
}) {
  // const blogIndex = BLOGS.findIndex((post) => {
  // 	return post.title === article.title;
  // });
  // const blog = BLOGS[blogIndex];
  // const startIndex =
  // 	blogIndex > BLOGS.length - 5 ? BLOGS.length - 4 : blogIndex + 1;
  //
  // const ALTERNATIVE_POSTS = BLOGS.slice(startIndex, startIndex + 4);
  return (
    <>
      {/* {article.jsonSchema && (
				<script
					key="schema-jsonld"
					type="application/ld+json"
					dangerouslySetInnerHTML={{
						__html: JSON.stringify(article.jsonSchema, null, "\t"),
					}}
				/>
			)} */}

      {/* <Header /> */}
      {/* @ts-ignore */}
      <Container className="mt-8 lg:mt-16">
        <div className="xl:relative">
          <div className="mx-auto max-w-2xl">
            <Link
              href={"/blog" as Route}
              aria-label="Go back to blogs"
              className="group mb-8 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md ring-1 shadow-zinc-800/5 ring-zinc-900/5 transition lg:absolute lg:-left-5 lg:-mt-2 lg:mb-0 xl:-top-1.5 xl:left-0 xl:mt-0"
            >
              <ArrowLeftIcon className="h-4 w-4 stroke-zinc-500 transition group-hover:stroke-zinc-700" />
            </Link>
            <article>
              {/* <header className="flex flex-col">
								<div className="flex items-center justify-between">
									<time
										dateTime={article.date}
										className="flex items-center text-base text-zinc-400"
									>
										<span className="h-4 w-0.5 rounded-full bg-zinc-200" />
										<span className="ml-3">{formatDate(article.date)}</span>
									</time>
									<div className="flex gap-1.5">
										{blog && <BlogShare blog={blog} />}
									</div>
								</div>
								<h1 className="mt-6 text-4xl font-bold tracking-tight text-zinc-800 sm:text-5xl">
									{article.title}
								</h1>
							</header> */}
              <Prose className="mt-8 w-full" data-mdx-content>
                {children}
              </Prose>
            </article>
          </div>
        </div>
      </Container>
      <div className="mx-auto mt-16 max-w-7xl px-6 lg:px-8">
        <div className="mb-12 h-[1px] w-full bg-gray-300"></div>
        <header className="mb-8 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-500">
            Continue Reading...
          </h3>
          <Link
            href={"/blog" as Route}
            className="text-indigo-500 hover:underline"
          >
            View All Blogs →
          </Link>
        </header>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* {ALTERNATIVE_POSTS.map((post) => {
						return (
							<Link
								key={post.id}
								className="bg-secondaryBg group flex flex-col rounded-lg p-6 hover:bg-gray-100"
								href={post.href}
							>
								<div className="undefined max-w-max rounded bg-indigo-50 px-1.5 py-1 text-xs font-bold uppercase text-indigo-500">
									{post.category.title}
								</div>
								<div className="flex-grow">
									<header className="mb-1 mt-2 text-lg font-bold">
										<span className="line-clamp-2">{post.title}</span>
									</header>
									<p className="line-clamp-3 text-base text-gray-800">
										<span className="">{post.description}</span>
									</p>
								</div>
								<div className="mt-6 flex items-center gap-3">
									<Image
										width={24}
										height={24}
										src={post.author.imageUrl}
										alt="Author image"
										className="h-6 w-6 overflow-hidden rounded-full"
										unoptimized
									/>
									<span className="text-sm font-medium text-gray-500">
										{post.author.name}
									</span>
									<svg
										width="6"
										height="24"
										viewBox="0 0 6 24"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
									>
										<rect
											x="4.16754"
											y="0.00866699"
											width="2"
											height="24"
											rx="1"
											transform="rotate(10 4.16754 0.00866699)"
											fill="currentColor"
											fill-opacity="0.1"
										></rect>
									</svg>
									<span className="text-sm font-medium text-gray-500">
										{post.date}
									</span>
								</div>
							</Link>
						);
					})} */}
        </div>
      </div>
      {/* <Footer /> */}
    </>
  );
}
