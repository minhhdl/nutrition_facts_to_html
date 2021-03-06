// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import formidable from 'formidable';
import vision from '@google-cloud/vision';

const credential = JSON.parse(
  Buffer.from(process.env.GCLOUD_CREDENTIALS, 'base64').toString(),
);

const client = new vision.ImageAnnotatorClient({
  projectId: 'comspaces-1554534785099',
  credentials: credential,
});

// const client = new vision.ImageAnnotatorClient();

export default async (req, res) => {
  try {
    const form = formidable({ multiple: false, keepExtensions: true });

    const files = await new Promise((resolve, reject) => {
      form.parse(req, (error, fields, files) => {
        if (error) {
          reject(error);
        }
        resolve(files);
      });
      // resolve();
    });
    const file = files[Object.keys(files)[0]];

    const [result] = await client.textDetection(file.path);

    res.statusCode = 200;
    res.json(result);
  } catch (e) {
    throw e;
  }
};

export const config = {
  api: {
    bodyParser: false,
  },
  async headers() {
    return [
      {
        source: '/api/process-image',
        headers: [
          {
            key: 'Content-Type',
            value: 'multipart/form-data',
          },
        ],
      },
    ];
  },
};
