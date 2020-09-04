// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import formidable from 'formidable';

export default async (req, res) => {
  const form = new formidable();
  await new Promise((resolve) => {
    form.parse(req, (...args) => {
      res.json({ ...args });
      resolve();
    });
  });
  // res.statusCode = 200;
  // res.json({ name: 'John Doe' });
};
