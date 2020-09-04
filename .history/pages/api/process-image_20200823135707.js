// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import formidable from 'formidable';

export default async (req, res) => {
  const form = formidable();
  const args = await new Promise((resolve) => {
    form.parse(req, (...args) => {
      resolve(args);
    });
  });
  res.statusCode = 200;
  res.json({ ...args });
};
