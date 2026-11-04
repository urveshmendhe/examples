import * as k8s from "@pulumi/kubernetes";

export function createPrometheus(
    namespace: k8s.core.v1.Namespace
) {
    return new k8s.helm.v3.Release(
        "prometheus",
        {
            chart: "prometheus",

            repositoryOpts: {
                repo: "https://prometheus-community.github.io/helm-charts",
            },

            namespace: namespace.metadata.name,
        },
        {
            dependsOn: [namespace],
        }
    );
}
