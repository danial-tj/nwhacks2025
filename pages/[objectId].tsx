import type { GetServerSideProps } from "next";
import { getScene, scenes } from "../lib/scenes";
export default function LegacyObject() {
  return null;
}
export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const id = String(params?.objectId || "");
  const scene =
    getScene(id) || (/^[1-8]$/.test(id) ? scenes[Number(id) - 1] : undefined);
  return scene
    ? { redirect: { destination: `/#${scene.id}`, permanent: false } }
    : { notFound: true };
};
