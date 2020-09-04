import React, {useState} from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

export default function Home() {

  const handleUpload = ()
  return (
    <div className={styles.container}>
      <Head>
        <title>Nutrition Facts to HTML</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to <a href="https://nextjs.org">Next.js!</a>
        </h1>

        <div>
          <input type="file" id="file" />
        </div>
      </main>
    </div>
  );
}
