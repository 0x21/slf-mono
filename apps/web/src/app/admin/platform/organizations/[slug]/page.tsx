import Client from "./client";

export default async function Page(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;

  return <Client params={params} />;
}
