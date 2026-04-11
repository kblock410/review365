import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "お客様アンケート",
  other: {
    "viewport": "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  },
};

export default function SurveyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
