#include <thread>
#include <vector>
#include <algorithm>

std::vector<std::thread> threads;

void start_thread(std::thread t) {
    threads.push_back(move(t));
}

/*
 * Remove all joined threads
 * from the threads vector.
 */
void remove_joined_threads() {
   threads.erase
        (remove_if(begin(threads),
                   end(threads),
                   [&](const std::thread &t) {
                       return !t.joinable();
                   }),
         end(threads));
}

/*
 * Join all yet unjoined threads in the threads vector.
 * No need to shrink the vector, since this function
 * is supposed to be called at the end of main.
 */
void join_all_threads() {
    for (auto &t : threads) {
        if (t.joinable()) {
            t.join();
        }
    }
    remove_joined_threads();
}

struct Threads {
    ~Threads() {
        join_all_threads();
    }
} thrds;
