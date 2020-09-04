import React, { useState, useMemo, useCallback } from 'react';
import Head from 'next/head';
import axios from 'axios';
import ReactFittext from 'react-fittext';
import { Textfit } from 'react-textfit';
import { Container, Grid } from '@material-ui/core';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [file, setFile] = useState(null);
  const [textAnnotations, setTextAnnotations] = useState(null);

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
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setTextAnnotations(result.data.textAnnotations);
    } catch (e) {}
  };

  const container = useMemo(() => {
    if (textAnnotations) {
      const firstItem = textAnnotations[0];
      const { vertices } = firstItem.boundingPoly;
      const [tlPoint, trPoint, brPoint, blPoint] = vertices;
      return {
        width: trPoint.x,
        height: brPoint.y,
      };
    }
    return { width: 0, height: 0 };
  }, [textAnnotations]);

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
        <Grid container>
          <Grid item>
            <div
              style={{
                ...container,
                backgroundColor: '#f8f8f8',
                position: 'relative',
              }}
            >
              {textAnnotations &&
                textAnnotations.slice(1).map((item, index) => {
                  const { vertices } = item.boundingPoly;
                  const [tlPoint, trPoint, brPoint, blPoint] = vertices;
                  const width = trPoint.x - tlPoint.x;
                  const height = blPoint.y - tlPoint.y;
                  const top = tlPoint.y;
                  const left = tlPoint.x;
                  return (
                    <div
                      key={index}
                      style={{ width, height, position: 'absolute', top, left }}
                    >
                      <Textfit mode="single">{item.description}</Textfit>
                    </div>
                  );
                })}
            </div>
          </Grid>
        </Grid>
      </main>
    </div>
  );
}
