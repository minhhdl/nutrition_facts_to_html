// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import formidable from 'formidable';
import vision from '@google-cloud/vision';
const client = new vision.ImageAnnotatorClient();

export default async (req, res) => {
  try {
    const form = formidable({ multiple: false });
    console.log(form);
    const files = await new Promise((resolve, reject) => {
      form.parse(req, (error, fields, files) => {
        if (error) {
          reject(error);
        }
        resolve(files);
      });
      // resolve();
    });
    const [result] = await client.textDetection(files[0]);

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
