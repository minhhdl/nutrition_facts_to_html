import React, { useState, useMemo, useRef, useLayoutEffect } from 'react';
import ReactDOMServer from 'react-dom/server';
import Head from 'next/head';
import axios from 'axios';
import { Container, Grid } from '@material-ui/core';
import beautifier from 'js-beautify';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-html';
import 'ace-builds/src-noconflict/theme-solarized_dark';
import styles from '../styles/Home.module.css';

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

const analyzeText = (fullText, ocrResult) =>
  new Promise((resolve) => {
    let result = [...ocrResult];
    const byRow = {};
    for (let rowIndex in fullText) {
      const matchedIndexes = [];
      const row = fullText[rowIndex];
      const rowWordsLength = row.split(' ').length;
      for (let index in result) {
        if (row.includes(result[index].description)) {
          byRow[rowIndex] = byRow[rowIndex]
            ? [...byRow[rowIndex], result[index]]
            : [result[index]];
          matchedIndexes.push(parseInt(index));
        }

        if (matchedIndexes.length === rowWordsLength) break;
      }
      const tmp = result.filter(
        (item, index) => !matchedIndexes.includes(index),
      );
      result = [...tmp];
    }
    resolve(byRow);
  });

export default function Home() {
  const [file, setFile] = useState(null);
  const [base64, setBase64] = useState(null);
  const [fullText, setFullText] = useState('');
  const [textByLine, setTextByLine] = useState([]);
  const [textAnnotations, setTextAnnotations] = useState(null);
  const [htmlCode, setHtmlCode] = useState('');
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const imageRef = useRef();

  React.useEffect(() => {
    convertHtml();
  }, [textByLine]);

  const handleFileChange = async (e) => {
    if (!e.target.files || e.target.files.length === 0) {
      return null;
    }
    setFile(e.target.files[0]);
    const base = await toBase64(e.target.files[0]);
    setBase64(base);
    localStorage.setItem('base64', base);
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
      const tmp = [...result.data.textAnnotations];
      const fullTextResult = tmp[0].description.split('\n');
      const byRow = await analyzeText(fullTextResult, tmp.slice(1));
      setTextByLine(byRow);
      setFullText(tmp[0].description.split('\n'));
      localStorage.setItem('byRow', JSON.stringify(byRow));
      localStorage.setItem('fullText', fullTextResult);
      localStorage.setItem(
        'textAnnotations',
        JSON.stringify(result.data.textAnnotations),
      );
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

  const convertHtml = () => {
    if (!container || !textByLine.length === 0) return null;
    const containerRatio = container.width / container.height;
    const widthRatio = imageRef?.current.clientWidth / container.width;

    const widthByRatio = container.width * widthRatio;
    const heightByRatio = (container.width * widthRatio) / containerRatio;

    console.log(
      imageRef?.current.clientWidth,
      widthRatio,
      widthByRatio,
      heightByRatio,
      container.width,
      container.height,
      containerRatio,
    );

    const html = ReactDOMServer.renderToStaticMarkup(
      <div
        style={{
          ...container,
          backgroundColor: '#f8f8f8',
          position: 'relative',
          // fontSize: heightByRatio,
          // lineHeight: 1,
          maxWidth: '100%',
        }}
      >
        {Object.keys(textByLine).map((key) => {
          const row = textByLine[key];
          const firstWord = row[0];
          const { vertices } = firstWord.boundingPoly;
          const [tlPoint, trPoint, brPoint, blPoint] = vertices;
          const height = ((blPoint.y - tlPoint.y) * 100) / heightByRatio;
          const top = (tlPoint.y / heightByRatio) * 100;
          const left = (tlPoint.x / widthByRatio) * 100;

          return (
            <div
              className={styles.row}
              style={{
                maxWidth: '100%',
                height: `${height}%`,
                position: 'absolute',
                top: `${top}%`,
                left: `${left}%`,
                fontSize: `${height}%`,
                lineHeight: 1,
              }}
            >
              {row.map((word) => word.description).join(' ')}
            </div>
          );
        })}
      </div>,
    );

    setHtmlCode(
      beautifier.html_beautify(html, {
        html: {
          end_with_newline: true,
          js: {
            indent_size: 2,
          },
          css: {
            indent_size: 2,
          },
        },
      }),
    );
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Nutrition Facts to HTML</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Container>
        <main className={styles.main}>
          <h1 className={styles.title}>Nutrition Facts to HTML</h1>

          <div>
            <input
              type="file"
              multiple={false}
              id="file"
              onChange={handleFileChange}
            />
            <button onClick={handleUpload}>Upload</button>
          </div>
          <Grid container spacing={2}>
            <Grid item lg={6}>
              <h4>Image</h4>
              <div
                style={{
                  ...container,
                  maxWidth: '100%',
                  backgroundColor: '#f8f8f8',
                  position: 'relative',
                }}
              >
                <img
                  ref={imageRef}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                  src={base64}
                />
              </div>
            </Grid>
            <Grid item lg={6}>
              <h4>Kết quả</h4>
              <div dangerouslySetInnerHTML={{ __html: htmlCode }} />
            </Grid>
          </Grid>
          <Grid container>
            <Grid item xs={12}>
              <h4>Kích thước:</h4>
              <div>
                <label htmlFor="width">Width{'\n'}</label>
                <input id="width" type="numeric" value={width} />
                {'\n'}
                <label htmlFor="height">Height{'\n'}</label>
                <input id="height" type="numeric" value={height} />
              </div>
            </Grid>
          </Grid>
          <Grid container>
            <Grid item xs={12}>
              <h4>HTML Code:</h4>
              <div>
                <AceEditor
                  mode="html"
                  theme="solarized_dark"
                  onChange={(code) => setHtmlCode(code)}
                  name="htmlCode"
                  value={htmlCode}
                  wrapEnabled
                  width={'100%'}
                  height={'800px'}
                  setOptions={{
                    // enableBasicAutocompletion: true,
                    // enableLiveAutocompletion: true,
                    enableSnippets: true,
                  }}
                />
                {/* <Editor
                  value={htmlCode}
                  onValueChange={(code) => setHtmlCode(code)}
                  highlight={(code) => highlight(code, languages.js)}
                  padding={10}
                  style={{
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: 12,
                  }}
                /> */}
              </div>
            </Grid>
          </Grid>
        </main>
      </Container>
    </div>
  );
}
