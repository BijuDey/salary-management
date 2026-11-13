import { AppShell } from '@/components/app-shell';

/** Signed-in area: everything inside gets the sidebar navigation. */
export default function WorkspaceLayout({ children }: LayoutProps<'/'>) {
  return <AppShell>{children}</AppShell>;
}
