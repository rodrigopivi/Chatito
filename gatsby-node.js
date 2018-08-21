exports.onCreateWebpackConfig = ({ actions, stage, loaders }) => {
  const jsLoader = loaders.js();
  // if (stage === `build-javascript`) {
  actions.setWebpackConfig({
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: jsLoader.loader,
            }
          ]
        }
      ]
    }
  });
  // }
};
