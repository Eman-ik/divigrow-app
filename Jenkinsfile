pipeline {
    agent any

    environment {
        COMPOSE_FILE = "docker-compose.jenkins.yml"
    }

    stages {
        stage('Checkout Code') {
            steps {
                git branch: 'main', url: 'https://github.com/eman-15/divigrow-app.git'
            }
        }

        stage('Build and Run Containers') {
            steps {
                sh 'docker compose -f $COMPOSE_FILE down || true'
                sh 'docker compose -f $COMPOSE_FILE up --build -d'
            }
        }

        stage('Verify Running Containers') {
            steps {
                sh 'docker ps'
            }
        }
    }

    post {
        success {
            echo 'Build completed successfully.'
        }
        failure {
            echo 'Build failed.'
        }
    }
}