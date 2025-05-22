"use client";

export default function Client({ params }: { params: { slug: string } }) {
  return <>workspace - {params.slug}</>;
}
