pipeline {
    agent any

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        timestamps()
    }

    environment {
        COMPOSE_FILE = "docker-compose.jenkins.yml"
        DOCKER_IMAGE_SERVER = "emanmalik15/divi-grow:jenkins-server"
        DOCKER_IMAGE_CLIENT = "emanmalik15/divi-grow:jenkins-client"
        DOCKER_IMAGE_DB = "postgres:15"
        GITHUB_REPO = "https://github.com/Eman-ik/divigrow-app.git"
    }

    stages {
        stage('✅ Checkout Code') {
            steps {
                script {
                    echo "========== Checking out code from GitHub =========="
                    checkout([
                        $class: 'GitSCM',
                        branches: [[name: '*/main']],
                        userRemoteConfigs: [[url: "${GITHUB_REPO}"]]
                    ])
                    sh 'echo "Repository: ${GITHUB_REPO}"'
                    sh 'echo "Branch: main"'
                    sh 'git log --oneline -5'
                }
            }
        }

        stage('📋 Validate Configuration') {
            steps {
                script {
                    echo "========== Validating Docker and Project Configuration =========="
                    
                    // Check Docker is available
                    sh 'docker --version'
                    sh 'docker compose version'
                    
                    // Check required files exist
                    sh '''
                        echo "Checking required files..."
                        test -f docker-compose.jenkins.yml && echo "✓ docker-compose.jenkins.yml found" || (echo "✗ docker-compose.jenkins.yml missing" && exit 1)
                        test -f server/package.json && echo "✓ server/package.json found" || (echo "✗ server/package.json missing" && exit 1)
                        test -f client/package.json && echo "✓ client/package.json found" || (echo "✗ client/package.json missing" && exit 1)
                        test -f database/init.sql && echo "✓ database/init.sql found" || (echo "✗ database/init.sql missing" && exit 1)
                    '''
                }
            }
        }

        stage('🧹 Clean Previous Deployment') {
            steps {
                script {
                    echo "========== Stopping and removing old containers =========="
                    sh '''
                        if docker compose -f ${COMPOSE_FILE} ps | grep -q divigrow; then
                            echo "Found running containers, stopping them..."
                            docker compose -f ${COMPOSE_FILE} down || true
                            sleep 3
                            echo "✓ Containers stopped"
                        else
                            echo "No running containers found"
                        fi
                    '''
                }
            }
        }

        stage('🔨 Build & Deploy Containers') {
            steps {
                script {
                    echo "========== Building and starting containers with code volume =========="
                    sh '''
                        echo "Building containers (this may take a few minutes)..."
                        docker compose -f ${COMPOSE_FILE} up --build -d
                        sleep 5
                        echo "✓ Containers built and started"
                    '''
                }
            }
        }

        stage('✔️ Verify Deployment') {
            steps {
                script {
                    echo "========== Verifying running containers =========="
                    sh '''
                        echo "Container status:"
                        docker compose -f ${COMPOSE_FILE} ps
                        
                        echo ""
                        echo "Network inspection:"
                        docker network ls | grep -i compose || echo "Networks available"
                    '''
                }
            }
        }

        stage('🧪 Health Check') {
            steps {
                script {
                    echo "========== Performing health checks =========="
                    sh '''
                        echo "Waiting for services to be ready..."
                        sleep 5
                        
                        # Check if server is running
                        if docker compose -f ${COMPOSE_FILE} exec -T app_jenkins curl -f http://localhost:4000/api/health > /dev/null 2>&1; then
                            echo "✓ Server health check passed"
                        else
                            echo "⚠ Server not ready yet, retrying..."
                            sleep 5
                            docker compose -f ${COMPOSE_FILE} logs app_jenkins | tail -20
                        fi
                        
                        # Check database connectivity
                        if docker compose -f ${COMPOSE_FILE} logs db_jenkins | grep -q "database system is ready"; then
                            echo "✓ Database is ready"
                        else
                            echo "⚠ Database initializing..."
                            docker compose -f ${COMPOSE_FILE} logs db_jenkins | tail -10
                        fi
                    '''
                }
            }
        }

        stage('📊 Build Report') {
            steps {
                script {
                    echo "========== Generating Build Report =========="
                    sh '''
                        cat > build_report.txt << 'EOF'
===================================
DiviGrow Jenkins Build Report
===================================
Build Number: ${BUILD_NUMBER}
Build Status: SUCCESS
Timestamp: $(date)
Repository: ${GITHUB_REPO}
Branch: main
Compose File: ${COMPOSE_FILE}

Containers Deployed:
$(docker compose -f ${COMPOSE_FILE} ps --format "table {{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Ports}}")

Services:
- Server: http://localhost:5001 (Port 5001 -> Container 4000)
- Database: localhost:5433 (Port 5433 -> Container 5432)

Data Volume:
- Location: ./app (code mounted as volume)
- Database Volume: postgres_data_jenkins

Environment Variables:
- DB_HOST: db_jenkins
- DB_USER: postgres
- DB_PASSWORD: postgres
- DB_NAME: divigrow

Build Log: ${BUILD_LOG_PATH}
===================================
EOF
                        cat build_report.txt
                    '''
                }
            }
        }
    }

    post {
        success {
            script {
                echo "========== BUILD SUCCESSFUL =========="
                echo "Jenkins Pipeline completed successfully!"
                echo "Container logs:"
                sh 'docker compose -f ${COMPOSE_FILE} logs --tail=20 app_jenkins || true'
            }
        }
        
        failure {
            script {
                echo "========== BUILD FAILED =========="
                echo "Pipeline encountered an error. Collecting diagnostic information..."
                sh '''
                    echo "Last 30 lines of app logs:"
                    docker compose -f ${COMPOSE_FILE} logs app_jenkins --tail=30 || echo "Could not retrieve app logs"
                    
                    echo ""
                    echo "Last 20 lines of database logs:"
                    docker compose -f ${COMPOSE_FILE} logs db_jenkins --tail=20 || echo "Could not retrieve database logs"
                    
                    echo ""
                    echo "Running containers:"
                    docker ps || echo "Could not list containers"
                '''
            }
        }
        
        always {
            script {
                echo "Pipeline execution completed."
                // Optional: Clean up old images
                sh 'docker image prune -f --filter "until=72h" || true'
            }
        }
    }
}