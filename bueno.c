#include <stdio.h>
#include <stdint.h>
#include <stdbool.h>
#include <SDL2/SDL.h>

uint32_t * pixels;
int pixels_width;
int pixels_height;

float origin_x;
float origin_y;
float scale;

uint32_t colours[] = {
    0x747369,
    0xa09f93,
    0xd3d0c8,
    0xe8e6df,
    0xf2f0ec,
    0xf2777a,
    0xf99157,
    0xffcc66,
    0x99cc99,
    0x66cccc,
    0x6699cc,
    0xcc99cc,
    0xd27b53,
};

uint32_t col(int i) { return colours[i % (sizeof(colours)/sizeof(colours[0]))]; }

typedef struct { float x, y; } Vec;

Vec rotate(Vec v, float angle) {
    float ca = cos(angle);
    float sa = sin(angle);
    return (Vec){
        .x = (v.x * ca + v.y * -sa),
        .y = (v.x * sa + v.y * ca),
    };
}

Vec translate(Vec a, float x, float y) {
    return (Vec){a.x + x, a.y + y};
}

Vec transform(Vec v) {
    v.x *= scale;
    v.y *= -scale;
    v.x += origin_x;
    v.y += origin_y;
    return v;
}

Vec untransform(Vec v) {
    v.x -= origin_x;
    v.y -= origin_y;
    v.x /= scale;
    v.y /= -scale;
    return v;
}

void plot_point(int x, int y, uint32_t colour) {
    if (x < 0 || x >= pixels_width) return;
    if (y < 0 || y >= pixels_height) return;
    pixels[x + y * pixels_width] = colour;
}

void plot_line(int ax, int ay, int bx, int by, uint32_t colour) {
    int delta_x = abs(bx - ax);
    int delta_y = abs(by - ay);
    int step_x  = ax < bx ? 1 : -1;
    int step_y  = ay < by ? 1 : -1;
    int error   = (delta_x > delta_y ? delta_x : -delta_y) / 2;
    while (!(ax == bx && ay == by)) {
        plot_point(ax, ay, colour);
        int e = error;
        if (e > -delta_x) error -= delta_y, ax += step_x;
        if (e <  delta_y) error += delta_x, ay += step_y;
    }
}

void point(Vec v, uint32_t colour) {
    v = transform(v);
    plot_point(v.x, v.y, colour);
}

void line(Vec a, Vec b, uint32_t colour) {
    a = transform(a);
    b = transform(b);
    plot_line(a.x, a.y, b.x, b.y, colour);
}

void marker(Vec v, uint32_t colour) {
    v = transform(v);
    plot_line(v.x - 5, v.y - 5, v.x + 6, v.y + 6, colour);
    plot_line(v.x + 5, v.y - 5, v.x - 6, v.y + 6, colour);
}

void plot_triangle(float ax, float ay, float bx, float by, float cx, float cy, uint32_t c) {
    ay = floorf(ay), by = floorf(by), cy = floorf(cy);
    float t = 0.0f;
    if (ay > by) t = ax, ax = bx, bx = t, t = ay, ay = by, by = t;
    if (ay > cy) t = ax, ax = cx, cx = t, t = ay, ay = cy, cy = t;
    if (by > cy) t = bx, bx = cx, cx = t, t = by, by = cy, cy = t;
    float alpha = 0.0f, alpha_step = 1.0f / (cy - ay);
    float beta  = 0.0f, beta_step  = 1.0f / (by - ay);
    for (float y = ay; y < by; y++) {
        float sx = ax + (cx - ax) * alpha;
        float ex = ax + (bx - ax) * beta;
        if (sx > ex) t = sx, sx = ex, ex = t;
        ex = floorf(ex);
        for (int x = sx; x < ex; ++x) {
            plot_point(x, y, c);
        }
        alpha += alpha_step;
        beta += beta_step;
    }
    beta = 0.0f, beta_step = 1.0f / (cy - by);
    for (float y = by; y < cy; y++) {
        float sx = ax + (cx - ax) * alpha;
        float ex = bx + (cx - bx) * beta;
        if (sx > ex) t = sx, sx = ex, ex = t;
        ex = floorf(ex);
        for (int x = sx; x < ex; ++x) {
            plot_point(x, y, c);
        }
        alpha += alpha_step;
        beta += beta_step;
    }
}

void thick_line(Vec a, Vec b, uint32_t colour, float thickness) {
    a = transform(a);
    b = transform(b);
    thickness *= scale / 100.0f;
    float angle = atan2(b.y - a.y, b.x - a.x) + M_PI/2;
    Vec a1 = { a.x + cos(angle) * thickness, a.y + sin(angle) * thickness };
    Vec a2 = { a.x - cos(angle) * thickness, a.y - sin(angle) * thickness };
    Vec b1 = { b.x + cos(angle) * thickness, b.y + sin(angle) * thickness };
    Vec b2 = { b.x - cos(angle) * thickness, b.y - sin(angle) * thickness };
    plot_triangle(a1.x, a1.y, a2.x, a2.y, b2.x, b2.y, colour);
    plot_triangle(b2.x, b2.y, a1.x, a1.y, b1.x, b1.y, colour);
    for (int i = 0; i < 16; ++i) {
        float ca = i * 0.39269;
        float da = (i-1) * 0.39269;
        float cx = a.x + cos(ca) * thickness;
        float cy = a.y + sin(ca) * thickness;
        float dx = a.x + cos(da) * thickness;
        float dy = a.y + sin(da) * thickness;
        plot_triangle(a.x, a.y, cx, cy, dx, dy, colour);
    }
}


int main() {
    SDL_Init(SDL_INIT_VIDEO);

    pixels_width = 800;
    pixels_height = 600;

    SDL_Window * window = SDL_CreateWindow("",
        SDL_WINDOWPOS_CENTERED, SDL_WINDOWPOS_CENTERED,
        pixels_width, pixels_height,
        SDL_WINDOW_RESIZABLE);

    SDL_Renderer * renderer = SDL_CreateRenderer(window,
        -1, SDL_RENDERER_PRESENTVSYNC);

    SDL_Texture * screen_texture = SDL_CreateTexture(renderer,
        SDL_PIXELFORMAT_ARGB8888, SDL_TEXTUREACCESS_STREAMING,
        pixels_width, pixels_height);

    pixels = malloc(pixels_width * pixels_height * sizeof(uint32_t));

    origin_x = pixels_width / 2;
    origin_y = pixels_height / 2;
    scale = 35;

    Vec points[] = {
        { 0.000000,  0.000000 },
        { 0.600000,  0.346800 },
        { 0.600000, -0.353200 },
        { 0.700000,  0.000000 },
        { 1.000000, -0.577400 },
        { 1.000000,  0.000000 },
        { 1.000000,  0.577400 },
        { 1.300000,  0.000000 },
        { 1.400000, -0.350000 },
        { 1.400000,  0.346000 },
        { 1.500000, -0.866000 },
        { 1.500000,  0.866000 },
        { 1.647800, -0.610200 },
        { 1.654600,  0.598200 },
        { 1.726400,  0.996800 },
        { 1.737600, -1.003200 },
        { 1.876600,  0.680000 },
        { 1.879800, -0.696600 },
        { 2.000000,  0.000000 },
        { 2.347600,  0.602200 },
        { 2.354600, -0.614200 },
        { 2.600000,  0.350000 },
        { 2.600000, -0.354000 },
        { 2.704600,  0.000000 },
        { 3.000000, -0.577400 },
        { 3.000000, -1.732000 },
        { 3.000000,  0.000000 },
        { 3.000000,  0.577400 },
        { 3.000000,  1.732000 },
    };

    srand(SDL_GetTicks()*SDL_GetPerformanceCounter());

    int line_count = 2 + (rand() % 10);
    int walk[64];
    for (int i = 0; i < line_count; ++i) walk[i] = rand() % 29;
    uint32_t pattern_colour = col(rand());

    int mouse_x, mouse_y;
    while (1) {
        SDL_Event event;
        while (SDL_PollEvent(&event)) {
            if (event.type == SDL_QUIT) {
                exit(0);
            } else if (event.type == SDL_MOUSEWHEEL) {
                scale += event.wheel.y;
                scale = scale < 10 ? 10 : scale;
                scale = scale > 1000 ? 1000 : scale;
            } else if (event.type == SDL_MOUSEMOTION) {
                if (event.motion.state & SDL_BUTTON_LMASK) {
                    origin_x += event.motion.xrel;
                    origin_y += event.motion.yrel;
                }
                mouse_x = event.motion.x;
                mouse_y = event.motion.y;
                Vec m = untransform((Vec){event.motion.x, event.motion.y});
                char title[32];
                snprintf(title, 32, "%.2f %.2f", m.x, m.y);
                SDL_SetWindowTitle(window, title);
            } else if (event.type == SDL_KEYDOWN) {
                int sc = event.key.keysym.scancode;
                if (sc == SDL_SCANCODE_SPACE) {
                    line_count = 2 + (rand() % 10);
                    for (int i = 0; i < line_count; ++i) walk[i] = rand() % 29;
                    pattern_colour = col(rand());
                } else {
                    pattern_colour = col(sc);
                }
            }
        }

        memset(pixels, 0x2d, pixels_width * pixels_height * 4);

        for (int ty = -1; ty < 2; ++ty) {
            float rx = 3 * sin(1.04719);
            float ry = ty * 12 * sin(1.04719);
            for (int tx = -5; tx < 4; ++tx) {
                float xoff = rx + tx * 3;
                float yoff = ry + (tx & 1) * (6 * sin(1.04719));
                float x = xoff + cos(1.04719);
                float y = yoff + sin(1.04719);
                for (float a = 0; a < 6.0; a += 1.0479) {
                    for (int i = 1; i < line_count; i++) {
                        Vec pa = translate(rotate(points[walk[i]], a), x, y);
                        Vec pb = translate(rotate(points[walk[i-1]], a), x, y);
                        thick_line(pa, pb, pattern_colour, 5);
                    }
                    Vec pa = translate(rotate(points[walk[0]], a), x, y);
                    Vec pb = translate(rotate(points[walk[line_count-1]], a), x, y);
                    thick_line(pa, pb, pattern_colour, 5);
                }
            }
        }

        SDL_RenderClear(renderer);
        SDL_UpdateTexture(screen_texture, NULL, pixels, pixels_width * sizeof(uint32_t));
        SDL_RenderCopy(renderer, screen_texture, NULL, NULL);
        SDL_RenderPresent(renderer);
    }

}
