import { ReactNode } from "react";
import Head from "next/head";

const Layout = ({ children }: { children: ReactNode }): JSX.Element => {
    return (
        <>
            <Head>
                <title>Train of Thought</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <main className="min-h-screen bg-neutral-800 text-white">{children}</main>
        </>
    );
};

export default Layout;
