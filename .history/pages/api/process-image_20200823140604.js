// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import formidable from 'formidable';

export default async (req, res) => {
  try {
    const form = formidable({ multiple: false });
    const args = await new Promise((resolve) => {
      form.parse(req, (error, fields, files) => {
        console.log(error.message);
        resolve(args);
      });
      // resolve();
    });
    res.statusCode = 200;
    res.json({ ...args });
  } catch (e) {
    throw e;
  }
};
