module.exports = {
    pathPrefix: '/Chatito',
    siteMetadata: {
        title: 'Chatito'
    },
    plugins: [
        {
            resolve: `gatsby-plugin-typescript`,
            options: {},
        },
        {
            resolve: 'gatsby-plugin-page-creator',
            options: {
                path: `${__dirname}/web/pages`
            }
        },
        'gatsby-plugin-react-helmet',
        {
            resolve: 'gatsby-plugin-styled-components',
            options: {},
        },
    ],
};