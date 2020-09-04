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
    const file = files[Object.keys(files)[0]];
    console.log(file);
    const [result] = await client.textDetection({
      image: { content: new Buffer(file) },
      // features: ['TEXT_DETECTION'],
    });

    res.statusCode = 200;
    res.json(result);
  } catch (e) {
    console.log(e);
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
