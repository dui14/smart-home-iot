Import("env")

import os
from shutil import copy2


def _copy_artifacts(source, target, env):
    project_dir = env.subst("$PROJECT_DIR")
    build_dir = env.subst("$BUILD_DIR")
    progname = env.subst("$PROGNAME")

    out_dir = os.path.join(project_dir, "wokwi")
    os.makedirs(out_dir, exist_ok=True)

    src_bin = os.path.join(build_dir, f"{progname}.bin")
    src_elf = os.path.join(build_dir, f"{progname}.elf")

    dst_bin = os.path.join(out_dir, "firmware.bin")
    dst_elf = os.path.join(out_dir, "firmware.elf")

    if os.path.isfile(src_bin):
        copy2(src_bin, dst_bin)
        print(f"[wokwi_copy] {src_bin} -> {dst_bin}")
    else:
        print(f"[wokwi_copy] Missing bin: {src_bin}")

    if os.path.isfile(src_elf):
        copy2(src_elf, dst_elf)
        print(f"[wokwi_copy] {src_elf} -> {dst_elf}")
    else:
        print(f"[wokwi_copy] Missing elf: {src_elf}")


# Run after the program is built (ensures .bin/.elf exist)
env.AddPostAction("buildprog", _copy_artifacts)
