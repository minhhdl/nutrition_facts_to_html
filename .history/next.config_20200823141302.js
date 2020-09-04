module.exports = {
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
      ,
    ];
  },
};
