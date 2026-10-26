pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '15'))
  }

  environment {
    // Daftarkan di Jenkins → Credentials (Secret text) dengan ID berikut.
    JWT_SECRET   = credentials('interntrack-jwt-secret')
    // Ubah sesuai domain/IP server deployment.
    API_BASEURL  = "${env.API_BASEURL ?: 'http://localhost:3000/api'}"
    CORS_ORIGIN  = "${env.CORS_ORIGIN ?: 'http://localhost:8080'}"
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Back-end: lint & test') {
      agent { docker { image 'node:22-bookworm'; reuseNode true } }
      steps {
        dir('backend') {
          sh 'npm ci'
          sh 'npm run lint'
          sh 'npm run test:ci'
        }
      }
      post {
        always {
          junit allowEmptyResults: true, testResults: 'backend/reports/junit.xml'
          archiveArtifacts artifacts: 'backend/coverage/lcov.info', allowEmptyArchive: true
        }
      }
    }

    stage('Front-end: lint, test & build') {
      agent { docker { image 'node:22-bookworm'; reuseNode true } }
      steps {
        dir('frontend') {
          sh 'npm ci'
          sh 'npm run lint'
          sh 'npm run test:ci'
          sh 'npm run build'
        }
      }
      post {
        always {
          junit allowEmptyResults: true, testResults: 'frontend/reports/junit.xml'
          archiveArtifacts artifacts: 'frontend/coverage/lcov.info', allowEmptyArchive: true
        }
      }
    }

    stage('Deploy') {
      when { anyOf { branch 'main'; branch 'master' } }
      steps {
        sh 'docker compose up -d --build --remove-orphans'
      }
    }

    stage('Smoke test') {
      when { anyOf { branch 'main'; branch 'master' } }
      steps {
        sh '''
          for i in $(seq 1 20); do
            curl -fsS http://localhost:${BACKEND_PORT:-3000}/api/health && exit 0
            sleep 3
          done
          echo "Back-end tidak merespons setelah deployment"; exit 1
        '''
      }
    }
  }

  post {
    success { echo 'Pipeline berhasil: tes lulus dan aplikasi ter-deploy.' }
    failure { echo 'Pipeline gagal — periksa log tahap yang merah.' }
  }
}
