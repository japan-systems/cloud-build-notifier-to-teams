const axios = require('axios');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const client = new SecretManagerServiceClient();

/**
 * Triggered from a message on a Cloud Pub/Sub topic.
 *
 * @param {!Object} event Event payload.
 * @param {!Object} context Metadata for the event.
 */
exports.notify = (event, context) => {
  if (!event.data) {
    return;
  }
  const data = JSON.parse(Buffer.from(event.data, 'base64').toString())

  if (data.source && data.source.repoSource && (data.status === 'SUCCESS' || data.status === 'FAILURE')) {
    (async () => {
      const [secret] = await client.accessSecretVersion({
        name: `projects/${data.projectId}/secrets/${process.env.SECRET_NAME}/versions/latest`
      });
      const url = secret.payload.data.toString();

      axios.post(url, {
        title: '&#x1F528; Test and Build Result',
        text: `&#x1F6A8; **STATUS**: ${data.status} ${data.status === 'SUCCESS' ? '&#x1F389;' : '&#x1F621;'}  \n` +
          `&#x1F517; [BUILD DETAIL](${data.logUrl})`,
        themeColor: `${data.status === 'SUCCESS' ? '28a745' : 'dc3545'}`
      }).catch((error) => {
        console.error(error);
      });
    })();
  }
};
