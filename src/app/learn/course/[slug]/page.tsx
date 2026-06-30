import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbLd } from "@/lib/seo-data/jsonld";
import { JsonLd } from "@/components/json-ld";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { COURSES, getCourse } from "@/lib/learn/curriculum";
import { CourseRunner } from "./_course";

export function generateStaticParams() {
  return COURSES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const course = getCourse(slug);
  if (!course) return {};
  return buildMetadata({
    title: `Build a ${course.name} — interactive Discord bot course`,
    description: `${course.tagline} Write real code in your browser, check it, and learn to build a Discord bot step by step — free, no setup.`,
    path: `/learn/course/${slug}`,
  });
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = getCourse(slug);
  if (!course) notFound();

  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Learn", path: "/learn" },
          { name: course.name, path: `/learn/course/${slug}` },
        ])}
      />
      <SiteHeader />
      <CourseRunner slug={course.slug} />
      <SiteFooter />
    </>
  );
}
