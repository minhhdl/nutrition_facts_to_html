import React, { useState, useMemo, useRef, useLayoutEffect } from 'react';
import ReactDOMServer from 'react-dom/server';
import Head from 'next/head';
import axios from 'axios';
import {
  Container,
  Grid,
  Button,
  TextField,
  CircularProgress,
} from '@material-ui/core';
import beautifier from 'js-beautify';
import AceEditor from 'react-ace';
import ReactFittext from 'react-textfit';
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
  new Promise(async (resolve) => {
    let result = [...ocrResult];
    let byRow = [];
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
    byRow.sort((item1, item2) => {
      const item1First = item1[0];
      const item2First = item2[0];
      const { vertices: vertices1 } = item1First.boundingPoly;
      const { vertices: vertices2 } = item2First.boundingPoly;
      const [tlPoint1] = vertices1;
      const [tlPoint2] = vertices2;
      return tlPoint1.y - tlPoint2.y;
    });
    const wrapped = await wrapRow(byRow);
    resolve(wrapped);
  });

const checkIsOverlapping = (item1, item2) =>
  new Promise((resolve) => {
    const item1First = item1[item1.length - 1];
    const item2First = item2[item2.length - 1];
    // console.log(item1, item2, item1First, item2First);
    const { vertices: vertices1 } = item1First.boundingPoly;
    const { vertices: vertices2 } = item2First.boundingPoly;
    const [tlPoint1, trPoint1, brPoint1, blPoint1] = vertices1;
    const [tlPoint2, trPoint2, brPoint2, blPoint2] = vertices2;

    if (tlPoint1.y <= tlPoint2.y && tlPoint2.y <= blPoint1.y) {
      resolve(true);
    }

    if (tlPoint1.y <= blPoint2.y && blPoint2.y <= blPoint1.y) {
      resolve(true);
    }

    resolve(false);
  });

const wrapRow = (data) =>
  new Promise(async (resolve) => {
    const wrapped = [[data[0]]];
    for (let index = 1; index < data.length; index++) {
      const part = data[index];
      const rowCurrent = wrapped[wrapped.length - 1];
      const isOverlapping = await checkIsOverlapping(
        rowCurrent[rowCurrent.length - 1],
        part,
      );
      if (isOverlapping) {
        wrapped[wrapped.length - 1] = [...rowCurrent, part];
      } else {
        wrapped.push([part]);
      }
    }
    resolve(wrapped);
  });

export default function Home() {
  const [file, setFile] = useState(null);
  const [base64, setBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [tesseract, setTesseract] = useState(null);
  const [textByLine, setTextByLine] = useState([]);
  const [textAnnotations, setTextAnnotations] = useState(null);
  const [htmlCode, setHtmlCode] = useState('');
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [compressor, setCompressor] = useState(1);
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
      setLoading(true);
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
      setTesseract(result.data.tesseract);
      localStorage.setItem('byRow', JSON.stringify(byRow));
      localStorage.setItem('fullText', fullTextResult);
      localStorage.setItem(
        'textAnnotations',
        JSON.stringify(result.data.textAnnotations),
      );
      setErrorMessage('');
      setLoading(false);
    } catch (e) {
      setLoading(false);
      setErrorMessage(e.message);
    }
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

  const dimension = useMemo(() => {
    const containerRatio = container.width / container.height;
    const widthRatio = imageRef?.current?.clientWidth / container.width;

    const widthByRatio = container.width * widthRatio;
    const heightByRatio = (container.width * widthRatio) / containerRatio;

    const heightRatio = heightByRatio / container.height;
    setWidth(widthByRatio);
    setHeight(heightByRatio);
    return {
      width: widthByRatio,
      height: heightByRatio,
      widthRatio,
      heightRatio,
    };
  }, [container, textByLine]);

  const renderPart = (part, rowHeight, rowTlPoint) => {
    const firstWord = part[0];
    const { vertices } = firstWord.boundingPoly;
    const [tlPoint, trPoint, brPoint, blPoint] = vertices;
    const height = 15;
    const top = Math.floor(((tlPoint.y - rowTlPoint.y) / rowHeight) * 100);
    const left = Math.floor((tlPoint.x / container.width) * 100);

    return (
      <>
        <div
          style={{
            maxWidth: '100%',
            // height: `${height}%`,
            position: 'absolute',
            top: `${top}%`,
            bottom: 0,
            left: `${left}%`,
            margin: 'auto',
            fontSize: 15,
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {part.map((word) => word.description).join(' ')}
        </div>
      </>
    );
  };

  const convertHtml = () => {
    if (!container || !textByLine.length === 0) return null;
    const {
      width: widthByRatio,
      height: heightByRatio,
      widthRatio,
      heightRatio,
    } = dimension;
    console.log(textByLine);
    const html = ReactDOMServer.renderToStaticMarkup(
      <div
        style={{
          width: widthByRatio,
          height: heightByRatio,
          backgroundColor: '#f8f8f8',
          position: 'relative',
          fontSize: heightByRatio,
          lineHeight: 1,
          maxWidth: '100%',
        }}
      >
        {textByLine.map((row) => {
          const firstPart = row[0];
          const firstWord = firstPart[0];
          const { vertices } = firstWord.boundingPoly;
          const [tlPoint, trPoint, brPoint, blPoint] = vertices;
          const height = row.reduce((s, part) => {
            const firstWord = part[0];
            const { vertices } = firstWord.boundingPoly;
            const [tlPoint, trPoint, brPoint, blPoint] = vertices;
            const partHeight = Math.floor(
              ((blPoint.y - tlPoint.y) / container.height) * 100,
            );
            return s + partHeight;
          }, 0);

          return (
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                borderBottom: '1px solid #777',
                height: `${height * 1.25}%`,
              }}
            >
              {row.map((part, index) =>
                renderPart(part, (height * container.height) / 100, tlPoint),
              )}
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

      <Container maxWidth={false}>
        <main className={styles.main}>
          <h1 className={styles.title}>Nutrition Facts to HTML</h1>

          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: 20 }}>
              <input
                type="file"
                multiple={false}
                id="file"
                onChange={handleFileChange}
              />
            </div>
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpload}
              disabled={loading}
            >
              {loading && <CircularProgress color="secondary" />}
              Upload
            </Button>
          </div>
          <Grid container spacing={2}>
            <Grid item lg={6}>
              <h4>Image</h4>
              <div
                style={{
                  ...dimension,
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
            <Grid item lg={6}>
              <h4>Kích thước:</h4>
              <div>
                <TextField
                  id="width"
                  label="Width"
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                />
                {'\n'}
                <TextField
                  id="height"
                  label="Height"
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                />
              </div>
            </Grid>
            <Grid item lg={6}>
              <h4>Nén ký tự:</h4>
              <div>
                <TextField
                  id="compressor"
                  type="number"
                  label="Compressor"
                  value={compressor}
                  onChange={(e) => setCompressor(e.target.value)}
                />
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
