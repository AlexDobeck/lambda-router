import groovy.json.JsonOutput

node {
    ARTIFACTORY_BASE='https://artifactory.nike.com/artifactory/api/npm'
    ARTIFACTORY_USER='maven'
    ARTIFACTORY_PASS='ludist'

    stage 'Build'
    deleteDir()
    checkout scm
    try {
      sh "yarn"
      sh "npm run test"
    } catch (err) {
        handleError(err)
    }
    stage 'Publish'

    publishHTML (target: [
        allowMissing: false,
        alwaysLinkToLastBuild: false,
        keepAll: true,
        reportDir: 'coverage',
        reportFiles: 'index.html',
        reportName: "Istanbul Code Coverage Report"
    ])

    try {
        sh "curl -u ${ARTIFACTORY_USER}:${ARTIFACTORY_PASS} ${ARTIFACTORY_BASE}/auth > .npmrc"
        sh "echo \"registry=${ARTIFACTORY_BASE}/npm-nike\" >> .npmrc"
        sh "npm publish --registry ${ARTIFACTORY_BASE}/npm-local"
    } catch (err) {
        handleError(err)
    }
}

def handleError(err) {
    notifySlack("Build Failed lambda-router: ${err}")
    echo "Build Failed: ${err}"
    error "build failed: ${err} "
}

def notifySlack(text) {
    def slackURL = 'https://hooks.slack.com/services/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'
    def payload = JsonOutput.toJson([text      : text,
                                     channel   : '#team-chatter',
                                     username  : "jenkins",
                                     //token     : "IQtDjcb5cPCvPFfCGIfHTFBL",
                                     icon_emoji: ":robot_face:"])
    sh "curl -X POST --data-urlencode \'payload=${payload}\' ${slackURL}"
}