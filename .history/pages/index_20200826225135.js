import React, { useState } from 'react';
import Head from 'next/head';
import axios from 'axios';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    if (!e.target.files || e.target.files.length === 0) {
      return null;
    }
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    try {
      if (!file) return null;
      const form = new FormData();
      form.append('file', file);
      const result = await axios.post('/api/process-image', form, {
        headers: [('Content-Type': 'multipart/form-data')],
      });
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
            multiple={false}
            id="file"
            onChange={handleFileChange}
          />
          <button onClick={handleUpload}>Upload</button>
        </div>
      </main>
    </div>
  );
}
