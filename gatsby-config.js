module.exports = {
    pathPrefix: '/Chatito',
    siteMetadata: {
        title: 'Chatito'
    },
    plugins: [
        {
            resolve: 'gatsby-plugin-page-creator',
            options: {
                path: `${__dirname}/web/pages`
            }
        },
        'gatsby-plugin-react-helmet',
        'gatsby-plugin-typescript',
        'gatsby-plugin-styled-components'
    ]
};