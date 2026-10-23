import Head from 'expo-router/head';

/** Sets the browser tab and "Add to Home Screen" name on the web build. */
export function PageTitle({ title }: { title: string }) {
  return (
    <Head>
      <title>{title}</title>
    </Head>
  );
}
