import React, { useState } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {};

  const handleUpload = async () => {
    try {
    } catch (e) {}
  };
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
          <input
            type="file"
            id="file"
            onChange={(e) => setFile(e.target.files)}
          />
        </div>
      </main>
    </div>
  );
}
