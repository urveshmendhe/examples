import * as k8s from "@pulumi/kubernetes";

export function createGrafana(
    namespace: k8s.core.v1.Namespace
) {
    return new k8s.helm.v3.Release(
        "grafana",
        {
            chart: "grafana",

            repositoryOpts: {
                repo: "https://grafana.github.io/helm-charts",
            },

            namespace: namespace.metadata.name,

            values: {
                adminUser: "admin",
                adminPassword: "admin123",

                service: {
                    type: "NodePort",
                },
            },
        },
        {
            dependsOn: [namespace],
        }
    );
}
