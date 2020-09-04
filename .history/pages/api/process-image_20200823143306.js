// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import formidable from 'formidable';

export default async (req, res) => {
  try {
    const form = formidable({ multiple: false });
    console.log(form);
    const args = await new Promise((resolve, reject) => {
      form.parse(req, (error, fields, files) => {
        if (error) {
          reject(error);
        }
        resolve(fields, files);
      });
      // resolve();
    });
    res.statusCode = 200;
    res.json({});
  } catch (e) {
    throw e;
  }
};
